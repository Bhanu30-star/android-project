<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']))
{
	$pp_id1 = $_POST['party_id'];
	$ver = $_POST['distributor_id'];
	$product=array();
	$res = mysqli_query($con,"select * from tbl_product where status='Active' and distributor_id='$ver' and product_type in ('Serial No')");
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			$pro_val_id=$product_id;
			$res_retailer_stock = mysqli_query($con,"SELECT tbl_party_transaction_detail.product_id,tbl_party_transaction_detail.quantity FROM tbl_party_transaction,tbl_party_transaction_detail where tbl_party_transaction.transaction_id=tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_to='$pp_id1' and tbl_party_transaction_detail.product_id='$pro_val_id'");
			if(mysqli_num_rows($res_retailer_stock)>0)
			{
				$total_sale_qty=0;
				while($fetch_retailer_stock=mysqli_fetch_assoc($res_retailer_stock))
				{
					$total_sale_qty=$total_sale_qty+$fetch_retailer_stock['quantity'];
				}
				$retailer_stock_return = mysqli_query($con,"SELECT quantity FROM tbl_party_credit_note where distributor_id='$ver' and party_id='$pp_id1' and product_id='$pro_val_id'");
				$total_sale_return_qty=0;
				while($fetch_retailer_stock_return=mysqli_fetch_assoc($retailer_stock_return))
				{
					$total_sale_return_qty=$total_sale_return_qty+$fetch_retailer_stock_return['quantity'];
				}
				$product['product_id']=$product_id;
				$product['product_name']=$product_name;
				$product['product_price']=$product_price;
				$product['CGST']=$CGST;
				$product['SGST']=$SGST;
				$product['IGST']=$IGST;
				$product['tcs_tds_applicable']=$fetch_product['tcs_tds_applicable'];
				$product['serial_type']=$fetch_product['serial_type'];
				$product['data_type']=$fetch_product['data_type'];
				$product['decimal_category']=$decimal_category;
				$product['total_sale_qty']=$total_sale_qty-$total_sale_return_qty;
				$product['product_type']=$product_type;
				$product['product_detail']=array(); 
				$res_retailer_stock11 = mysqli_query($con,"SELECT tbl_party_transaction_detail.IMEI_NO FROM tbl_party_transaction,tbl_party_transaction_detail where tbl_party_transaction.transaction_id=tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_to='$pp_id1' and tbl_party_transaction_detail.product_id='$pro_val_id'");
				if(mysqli_num_rows($res_retailer_stock11)>0)
				{
					while($fetch_retailer_stock1=mysqli_fetch_assoc($res_retailer_stock11))
					{
						$sale_imei_no=$fetch_retailer_stock1['IMEI_NO'];
						$retailer_stock_return11 = mysqli_query($con,"SELECT tbl_party_credit_note.quantity FROM tbl_party_credit_note,tbl_party_credit_note_deatil where tbl_party_credit_note.unique_bill=tbl_party_credit_note_deatil.unique_bill and tbl_party_credit_note_deatil.product_id='$pro_val_id' and tbl_party_credit_note_deatil.IMEI='$sale_imei_no' and tbl_party_credit_note.distributor_id='$ver' and tbl_party_credit_note.party_id='$pp_id1'");
						if(mysqli_num_rows($retailer_stock_return11)<=0)
						{
							$product_detail['IMEI_NO']=$sale_imei_no;
							$product['product_detail'][]=$product_detail;
						}
					}
				}
				
				$response['product'][]=$product;
			}
		}
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Data Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>