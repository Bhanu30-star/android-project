<?php
include("../../connect.php");
$response = array();
if(isset($_POST['start_date']) && isset($_POST['distributor_id']) && isset($_POST['end_date']))
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
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$cdate_sale_1 = $_POST['start_date'];
	$cdate_sale_2 = $_POST['end_date'];
	$c_party=$_POST['party_id'];
	$c_operator=$_POST['soperator'];
	$res = "select *  from tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_date>='$cdate_sale_1' and tbl_party_transaction.transaction_date<='$cdate_sale_2' and tbl_party.distributor_id='$session_dist_ver' and tbl_party_transaction.bill_type='Tax Invoice' and tbl_party_transaction.operator_detail!=''";
	if($c_party!="")
		$res=$res." "."and tbl_party.party_id='$c_party'";
	if($c_operator!='')
		$res=$res." "."and tbl_party_transaction.operator_detail='$c_operator'";
	$res=$res." "."order by tbl_party_transaction.id ASC";
	$res_purchase = mysqli_query($con,$res);
	$salebook=array();
	if(mysqli_num_rows($res_purchase)>0)
	{
		$freeze_return=0;
		while($fetch_product2=mysqli_fetch_assoc($res_purchase))
		{
			if($fetch_product2['transaction_date']<$da)
				$freeze_return=1;
			$salebook['freeze']=$freeze_return;
			$salebook['transaction_bill_number']=$fetch_product2['transaction_bill_number'];
			$salebook['transaction_date']=$fetch_product2['transaction_date'];
			$salebook['transaction_time']=$fetch_product2['transaction_time'];
			$salebook['party_name']=$fetch_product2['party_name'];
			$salebook['party_phone']=$fetch_product2['party_phone'];
			$salebook['payment_mode']=$fetch_product2['payment_mode'];
			$salebook['operator_detail']=$fetch_product2['operator_detail'];
			$salebook['total_amount']=$fetch_product2['total_amount'];
			$salebook['final_amt']=$fetch_product2['final_amt'];
			$salebook['disc_amt']=$fetch_product2['disc_amt'];
			$salebook['bank_id']=$fetch_product2['bank_id'];
			if($fetch_product2['bank_id']!='' && $fetch_product2['bank_id']>0)
			{
				$bankselect=mysqli_query($con, "select * from tbl_distributor_bank_master where distributor_id='$session_dist_ver' and bank_master_id='".$fetch_product2['bank_id']."'");
				while($fetch_bank=mysqli_fetch_array($bankselect))
				{
					$salebook['bank_name']=$fetch_bank['bank_name'];
					$salebook['account_no']=$fetch_bank['account_no'];
				}
			}
			else
			{
				$salebook['bank_name']='';
				$salebook['account_no']='';
			}
			
			$trans_id=$fetch_product2['transaction_id'];
			$res1 = mysqli_query($con,"select * from tbl_party_transaction_detail where transaction_id='$trans_id'");
			while($fetch_product3=mysqli_fetch_assoc($res1))
			{
				$salebook['product_name']=$fetch_product3['product_name'];
				$salebook['product_price']=$fetch_product3['product_price'];
				$salebook['quantity']=$fetch_product3['quantity'];
				$salebook['cgst_amt']=$fetch_product3['CGST_amount'];
				$salebook['sgst_amt']=$fetch_product3['SGST_amount'];
				$salebook['igst_amt']=$fetch_product3['IGST_amount'];
				$salebook['igst_amt']=$fetch_product3['IGST_amount'];
			}
			$response['salebook'][]=$salebook;
		}
	}
	else
	{
		$response['salebook']=$salebook;
	}
	$response['success']='1';
	$response['details']="Bill Successfully Fetch";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>