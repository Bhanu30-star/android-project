<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{
	$cdate1=$_POST['searchdate1'];
	$cdate2=$_POST['searchdate2'];
	$temp_string=explode("-",$cdate1);
	$temp_string2=(string)$temp_string[1];
	$temp_string3=(string)$temp_string[2];
	if(strlen($temp_string2)==1)
	{
		$temp_string2="0".$temp_string2;
	}
	if(strlen($temp_string3)==1)
	{
		$temp_string3="0".$temp_string3;
	}
	$temp_data_date=$temp_string[0]."-".$temp_string2."-".$temp_string3;
	$temp_date2=strtotime($temp_data_date);
	$cdate1=date("Y-m-d",$temp_date2);
	$temp_string=explode("-",$cdate2);
	$temp_string2=(string)$temp_string[1];
	$temp_string3=(string)$temp_string[2];
	if(strlen($temp_string2)==1)
	{
		$temp_string2="0".$temp_string2;
	}
	if(strlen($temp_string3)==1)
	{
		$temp_string3="0".$temp_string3;
	}
	$temp_data_date=$temp_string[0]."-".$temp_string2."-".$temp_string3;
	$temp_date2=strtotime($temp_data_date);
	$cdate2=date("Y-m-d",$temp_date2);
	
	$ver=$_POST['distributor_id'];
	$cparty = isset($_POST['searchparty']) ? $_POST['searchparty'] : '';
	if($cparty!="")
	{
		$res = mysqli_query($con,"select *,tbl_distributor_transaction.product_price as pprice from tbl_distributor_transaction,tbl_purchase_party,tbl_product where tbl_distributor_transaction.party_id=tbl_purchase_party.purchase_party_id and  tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.transaction_date>='$cdate1' and tbl_distributor_transaction.transaction_date<='$cdate2' and tbl_purchase_party.purchase_party_id LIKE '".$cparty."%' and tbl_product.product_type!='Payout' order by tbl_distributor_transaction.id ASC");
	}
	else
	{
		$res = mysqli_query($con,"select *,tbl_distributor_transaction.product_price as pprice from tbl_distributor_transaction,tbl_purchase_party,tbl_product where tbl_distributor_transaction.party_id=tbl_purchase_party.purchase_party_id and  tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.transaction_date>='$cdate1' and tbl_distributor_transaction.transaction_date<='$cdate2' and tbl_product.product_type!='Payout' order by tbl_distributor_transaction.id ASC");
	}
	if(mysqli_num_rows($res)>0)
	{ 
		$product=array();
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$temp_txn_id=$fetch_product['transaction_id'];
			$return_quantity=0;
			$return_cgst_amt=0;
			$return_sgst_amt=$return_igst_amt=0;
			$return_cess_amt=0;
			$return_disc_amt=0;
			$return_net_amt=0;
			$return_total_amount=0;
			$actual_final_purchase_amt=0;
			$product['bill_no']=$fetch_product['bill_no'];
			$product['bill_date']=$fetch_product['bill_date'];
			$product['payment_mode']=$fetch_product['payment_mode'];
			$product['bill_time']=$fetch_product['bill_time'];
			$product['party_name']=$fetch_product['party_name'];
			$product['product_name']=$fetch_product['product_name'];
			$product['product_price']=$fetch_product['pprice'];
			$product['quantity']=$fetch_product['quantity'];
			$product['bag_type']=$fetch_product['bag_type'];
			$product['bag_qty']=$fetch_product['bag_qty'];
			$product['product_type']=$fetch_product['product_type'];
			
			
			$product_return= mysqli_query($con,"SELECT * FROM `tbl_purchase_return_transaction` WHERE `transaction_id`='$temp_txn_id'");
			while($pro_fetch_return=mysqli_fetch_array($product_return)) 
			{ 
				$return_quantity=$return_quantity+$pro_fetch_return['return_quantity'];
				$return_cgst_amt=$return_cgst_amt+$pro_fetch_return['return_cgst_amt'];
				$return_sgst_amt=$return_sgst_amt+$pro_fetch_return['return_sgst_amt'];
				$return_igst_amt=$return_igst_amt+$pro_fetch_return['return_igst_amt'];
				$return_cess_amt=$return_cess_amt+$pro_fetch_return['return_cess_amt'];
				$return_disc_amt=$return_disc_amt+$pro_fetch_return['return_discount'];
				$return_net_amt=$return_net_amt+$pro_fetch_return['return_net_amt'];
				$return_total_amount=$return_total_amount+$pro_fetch_return['return_total_amount'];
			}
			$actual_final_purchase_amt=($fetch_product['final_net_amt']-$return_net_amt)-(($fetch_product['cgst_amt']+$fetch_product['sgst_amt']+$fetch_product['cess_amt'])-($return_cgst_amt+$return_sgst_amt+$return_cess_amt));
			if($actual_final_purchase_amt<0)
				$actual_final_purchase_amt=0;
			
			
			$product['return_quantity']=$return_quantity;
			$product['actual_final_purchase_amt']=$actual_final_purchase_amt;
			
			if($fetch_product['cgst_amt']-$return_cgst_amt<0)
				$product['cgst_amt']='0';
			else
				$product['cgst_amt']= $fetch_product['cgst_amt']-$return_cgst_amt;
			
			if($fetch_product['sgst_amt']-$return_sgst_amt<0)
				$product['sgst_amt']='0';
			else
				$product['sgst_amt']= $fetch_product['sgst_amt']-$return_sgst_amt;
			
			if($fetch_product['igst_amt']-$return_igst_amt<0)
				$product['igst_amt']='0';
			else
				$product['igst_amt']= $fetch_product['return_igst_amt']-$return_igst_amt;
			
			if($fetch_product['cess_amt']-$return_cess_amt<0)
				$product['cess_amt']='0';
			else
				$product['cess_amt']= $fetch_product['cess_amt']-$return_cess_amt;
			
			if($fetch_product['total_amount']-$return_total_amount<0)
				$product['total_amount']='0';
			else
				$product['total_amount']= $fetch_product['total_amount']-$return_total_amount;
			
			if($fetch_product['discount_amt']-$return_disc_amt<0)
				$product['discount_amt']='0';
			else
				$product['discount_amt']= $fetch_product['discount_amt']-$return_disc_amt;
			
			if($fetch_product['final_net_amt']-$return_net_amt<0)
				$product['final_net_amt']='0';
			else
				$product['final_net_amt']= $fetch_product['final_net_amt']-$return_net_amt;
			$response['product'][]=$product;
		}
		$response['success']='1';
		$response['details']="Fetch Purchase Bill Successfully";
	}
	else
	{
		$response['success']='0';
		$response['details']="Detail Not Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>