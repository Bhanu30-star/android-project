<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['searchdate1']) && isset($_POST['searchdate2']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	
	$cdate1=$_POST['searchdate1'];
	$cdate2=$_POST['searchdate2'];
	$da  = date("Y-m-d");
	
	$closing=mysqli_query($con,"SELECT closing_amt FROM tbl_distributor_cash_collection WHERE distributor_id='$session_dist_ver' AND date<='$da' order by date desc limit 1");
	$fetch_closing=mysqli_fetch_array($closing);
	if(mysqli_num_rows($closing)>0)
	{
		$response['cash_in_hand']=$fetch_closing['closing_amt'];
	}
	else
	{
		$response['cash_in_hand']=0;
	}
	$res = mysqli_query($con,"SELECT tbl_distributor_bank_transfer.*,tbl_distributor_bank_master.bank_name FROM tbl_distributor_bank_transfer,tbl_distributor_bank_master WHERE tbl_distributor_bank_transfer.bank_id = tbl_distributor_bank_master.bank_master_id AND tbl_distributor_bank_transfer.insert_date>='$cdate1' AND tbl_distributor_bank_transfer.insert_date<='$cdate2' AND tbl_distributor_bank_transfer.distributor_id='$session_dist_ver' AND tbl_distributor_bank_transfer.status='Complete' ORDER BY tbl_distributor_bank_transfer.txn_id DESC");
	$bank_master_detail=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_array($res))
		{
			$contra_bank=$fetch_product['bank_contra_id'];
			$contra_bank_name='';
			if($contra_bank!='')
			{
				$ress = mysqli_query($con,"select * from tbl_distributor_bank_master where bank_master_id=$contra_bank");
				$fetch_product_value=mysqli_fetch_assoc($ress);
				$contra_bank_name = $fetch_product_value['bank_name'];
			}
			$flag=0;
			$bank_master_detail['txn_id']=$fetch_product['txn_id'];
			$bank_master_detail['bank_id']=$fetch_product['bank_id'];
			$bank_master_detail['bank_name']=$fetch_product['bank_name'];
			$bank_master_detail['transaction_id']=$fetch_product['transaction_id'];
			$bank_master_detail['deposit_amt']=$fetch_product['transfer_amt'];
			$bank_master_detail['withdrawal_amt']=$fetch_product['withdrawal_amt'];
			$bank_master_detail['contra_bank_name']=$contra_bank_name;
			$bank_master_detail['txn_type']=$fetch_product['txn_type'];
			$bank_master_detail['remark']=$fetch_product['remark'];
			$bank_master_detail['insert_date']=$fetch_product['insert_date'];
			$bank_master_detail['flag']=$flag;
			$response['bank_master_detail'][]=$bank_master_detail;
		}
	}
	else
	{
		$response['bank_master_detail']=$bank_master_detail;
	}
	
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['message']="Required Field Missing";
}	
echo json_encode($response);
?>