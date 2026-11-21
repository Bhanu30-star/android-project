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
	$cdate_pur_1 = $_POST['start_date'];
	$cdate_pur_2 = $_POST['end_date'];
	$c_party=$_POST['party_name'];
	$c_operator=$_POST['soperator'];
	$res = "select *,tbl_distributor_transaction.product_price as pprice from tbl_distributor_transaction,tbl_purchase_party,tbl_product where tbl_distributor_transaction.party_id=tbl_purchase_party.purchase_party_id and tbl_distributor_transaction.product_id = tbl_product.product_id and tbl_distributor_transaction.distributor_id='$session_dist_ver' and tbl_distributor_transaction.bill_date>='$cdate_pur_1' and tbl_distributor_transaction.bill_date<='$cdate_pur_2' and tbl_distributor_transaction.operator_detail!=''";
	if($c_party!='')
		$res=$res." "."and tbl_purchase_party.party_name LIKE '".$c_party."%'";
	if($c_operator!='')
		$res=$res." "."and tbl_distributor_transaction.operator_detail='$c_operator'";
	$res=$res." "."group by tbl_distributor_transaction.unique_bill, tbl_distributor_transaction.bill_no order by tbl_distributor_transaction.bill_date asc";
	$res_purchase = mysqli_query($con,$res);
	$purchasebook=array();
	if(mysqli_num_rows($res_purchase)>0)
	{
		$freeze_return=0;
		while($fetch_product2=mysqli_fetch_assoc($res_purchase))
		{
			if($fetch_product2['transaction_date']<$da)
				$freeze_return=1;
			$txn_productId=$fetch_product2['product_id'];
			$resstock_detail = mysqli_query($con,"select closing_stock from tbl_distributor_stock where distributor_id='$session_dist_ver' and product_id='$txn_productId' and date='$cdate11'");
			while($fetch_stockDetail=mysqli_fetch_assoc($resstock_detail))
			{
				if($fetch_stockDetail['closing_stock']<$fetch_product2['quantity'])
					$freeze_return=1;
			}
			$purchasebook['freeze']=$freeze_return;
			$purchasebook['bill_no']=$fetch_product2['bill_no'];
			$purchasebook['bill_date']=$fetch_product2['bill_date'];
			$purchasebook['bill_time']=$fetch_product2['bill_time'];
			$purchasebook['transaction_date']=$fetch_product2['transaction_date'];
			$purchasebook['transaction_time']=$fetch_product2['transaction_time'];
			$purchasebook['party_name']=$fetch_product2['party_name'];
			$purchasebook['gstin_no']=$fetch_product2['gstin_no'];
			$purchasebook['payment_mode']=$fetch_product2['payment_mode'];
			$purchasebook['operator_detail']=$fetch_product2['operator_detail'];
			$purchasebook['product_name']=$fetch_product2['product_name'];
			$purchasebook['pprice']=$fetch_product2['pprice'];
			$purchasebook['discount_amt']=$fetch_product2['discount_amt'];
			$purchasebook['quantity']=$fetch_product2['quantity'];
			$purchasebook['cgst_amt']=$fetch_product2['cgst_amt'];
			$purchasebook['sgst_amt']=$fetch_product2['sgst_amt'];
			$purchasebook['igst_amt']=$fetch_product2['igst_amt'];
			$purchasebook['final_net_amt']=$fetch_product2['final_net_amt'];
			$purchasebook['unique_bill']=$fetch_product2['unique_bill'];
			$purchasebook['bank_id']=$fetch_product2['bank_id'];
			if($fetch_product2['bank_id']!='' && $fetch_product2['bank_id']>0)
			{
				$bankselect=mysqli_query($con, "select * from tbl_distributor_bank_master where distributor_id='$session_dist_ver' and bank_master_id='".$fetch_product2['bank_id']."'");
				while($fetch_bank=mysqli_fetch_array($bankselect))
				{
					$purchasebook['bank_name']=$fetch_bank['bank_name'];
					$purchasebook['account_no']=$fetch_bank['account_no'];
				}
			}
			else
			{
				$purchasebook['bank_name']='';
				$purchasebook['account_no']='';
			}
			$response['purchasebook'][]=$purchasebook;
		}
	}
	else
	{
		$response['purchasebook']=$purchasebook;
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