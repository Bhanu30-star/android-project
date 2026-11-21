<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$dis_id = $_POST['distributor_id'];
	
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11=date("Y-m-d");
	$closing=mysqli_query($con,"SELECT closing_amt FROM tbl_distributor_cash_collection WHERE distributor_id='$dis_id' AND date<='$cdate11' order by date desc limit 1");
	$fetch_closing=mysqli_fetch_array($closing);
	if(mysqli_num_rows($closing)>0)
	{
		$response['cash_in_hand']=$fetch_closing['closing_amt'];
	}
	else
	{
		$response['cash_in_hand']=0;
	}
	
	$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE Distributor_id='$dis_id' and status='Active'");
	$bank_detail=array();
	if(mysqli_num_rows($bank_matser_detail)>0)
	{     
		while($fetch_product=mysqli_fetch_array($bank_matser_detail))
		{
			$tamt_closing=0;
			$entry_flag=0;
			$mst_id=$fetch_product['bank_master_id'];
			$product_detail = mysqli_query($con, "SELECT * FROM tbl_distributor_bank_collection where date<='$cdate11' and distributor_id='$dis_id' AND bank_id='$mst_id' order by date DESC limit 1");
            if (mysqli_num_rows($product_detail) > 0) 
			{
				$entry_flag=1;
                while ($fetch_detail = mysqli_fetch_array($product_detail)) 
				{
                   $tamt_closing = $fetch_detail['closing_amt'];
                }
            }
			$bank_detail['master_id']=$fetch_product['bank_master_id'];
			$bank_detail['bank_name']=$fetch_product['bank_name'];
			$bank_detail['account_no']=$fetch_product['account_no'];
			$bank_detail['account_name']=$fetch_product['account_name'];
			$bank_detail['branch_name']=$fetch_product['branch_name'];
			$bank_detail['ifse_code']=$fetch_product['ifsc_no'];
			$bank_detail['type']=$fetch_product['type'];
			$bank_detail['entry_flag']=$entry_flag;
			$bank_detail['tamt_closing']=$tamt_closing;
			$response['bank_detail'][]=$bank_detail;
		}
	}
	else
	{
		$response['bank_detail']=$bank_detail;
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